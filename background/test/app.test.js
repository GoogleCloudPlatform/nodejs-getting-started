const cp = require('child_process');
const path = require('path');
const projectId = process.env.GCLOUD_PROJECT;
const regionId = process.env.REGION_ID;
const app = `https://testservice-dot-${projectId}.${regionId}.r.appspot.com`;
const assert = require('assert');
const {v4: uuidv4} = require('uuid');
const {Firestore} = require('@google-cloud/firestore');
const fetch = require('node-fetch');
const {URLSearchParams} = require('url');
const waitOn = require('wait-on');

// eslint-disable-next-line node/no-extraneous-require
const {CloudFunctionsServiceClient} = require('@google-cloud/functions');

const opts = {
  resources: [app],
};

const delay = async (test, addMs) => {
  const retries = test.currentRetry();
  await new Promise((r) => setTimeout(r, addMs));
  // No retry on the first failure.
  if (retries === 0) return;
  // See: https://cloud.google.com/storage/docs/exponential-backoff
  const ms = Math.pow(2, retries) + Math.random() * 1000;
  return new Promise((done) => {
    console.info(`retrying "${test.title}" in ${ms}ms`);
    setTimeout(done, ms);
  });
};

async function deployService() {
  let uniqueID = uuidv4().split('-')[0];
  cp.execSync(`npm install`, {cwd: path.join(__dirname, '../', 'function')});
  try {
    cp.execSync(
      `gcloud functions deploy translate-${uniqueID} --runtime nodejs10 --allow-unauthenticated --set-env-vars=unique_id=${uniqueID} --trigger-topic translate`,
      {cwd: path.join(__dirname, '/testApp')}
    );
  } catch (err) {
    console.log("Wasn't able to deploy Google Cloud Function");
  }
  try {
    cp.execSync(`gcloud app deploy app.yaml`, {
      cwd: path.join(__dirname, '../', 'server'),
    });
  } catch (err) {
    console.log("Wasn't able to deploy app to AppEngine");
  }
  try {
    await waitOn(opts);
  } catch (err) {
    console.log(err);
  }

  return uniqueID;
}

async function deleteService(uniqueID) {
  try {
    cp.execSync(`gcloud app services delete testservice`, {
      cwd: path.join(__dirname, '/testApp'),
    });
  } catch (err) {
    console.log('Was not able to delete AppEngine Service');
  }
  try {
    cp.execSync(`gcloud functions delete translate-${uniqueID}`, {
      cwd: path.join(__dirname, '/testApp'),
    });
  } catch (err) {
    console.log("Wasn't able to delete Google Cloud Functions");
  }
  const db = new Firestore({
    project: projectId,
  });
  const res = await db.collection('/translations').get();
  res.forEach(async (element) => {
    await element.ref.delete();
  });
  console.log('Firebase translation collection deleted');
}

async function cleanupServices() {
  const client = new CloudFunctionsServiceClient();
  const [functions] = await client.listFunctions({
    parent: `projects/${projectId}/locations/-`,
  });
  // We'll delete functions older than 24 hours.
  const cutoff = Math.round(new Date().getTime() / 1000) - 24 * 3600;
  console.info(`about to delete services using cutoff second at ${cutoff}`);
  for (const fn of functions) {
    const updateSecond = parseInt(fn.updateTime.seconds, 10);
    console.info(`${fn.name} was updated at ${updateSecond}`);
    if (updateSecond < cutoff) {
      console.info(`it is too old, so deleting ${fn.name}`);
      const [operation] = await client.deleteFunction({name: fn.name});
      const [response] = await operation.promise();
      console.log(response);
    }
  }
}

describe('behavior of cloud function', function () {
  this.timeout(1800000); // 30 mins

  let uniqueID;
  before(async () => {
    cleanupServices();
    uniqueID = await deployService();
  });

  after(async () => {
    await deleteService(uniqueID);
  });

  it('should get the correct website', async function () {
    this.retries(4);
    await deployService();
    await delay(this.test, 4000);

    const body = await fetch(`${app}`);
    const res = await body.status;
    assert.strictEqual(res, 200);
  });

  it('should get the correct response', async function () {
    this.retries(6);
    this.timeout(1800000);
    await delay(this.test, 4000);
    const params = new URLSearchParams();
    params.append('lang', 'en');
    params.append('v', 'como estas');

    let body = await fetch(`${app}/request-translation`, {
      method: 'POST',
      body: params,
    });

    console.log(await body.text());
    let res = await body.status;
    assert.strictEqual(res, 200);

    body = await fetch(`${app}/`);
    res = await body.text();
    assert.ok(res.includes('how are you'));
  });
});
