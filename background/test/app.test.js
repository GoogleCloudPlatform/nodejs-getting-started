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

let uniqueID;
async function deployService() {
  uniqueID = uuidv4().split('-')[0];
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
}

describe('behavior of cloud function', function () {
  this.timeout(360000);

  afterEach(async () => {
    try {
      cp.execSync(`gcloud app services delete testservice`);
    } catch (err) {
      console.log('Was not able to delete AppEngine Service');
    }
    try {
      cp.execSync(`gcloud functions delete translate-${uniqueID}`);
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
    this.retries(4);
    await deployService();
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
