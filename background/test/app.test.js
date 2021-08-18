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
const uniqueID = uuidv4().split('-')[0];
const waitOn = require('wait-on');

const opts = {
  resources: [app],
};

async function pingVMExponentialForResponse(address, count) {
  await new Promise((r) => setTimeout(r, Math.pow(2, count) * 1000));
  try {
    const res = await fetch(address);
    const text = await res.text();
    if (!text.includes('how are you')) {
      throw new Error(res.body);
    }
  } catch (err) {
    process.stdout.write('.');
    await pingVMExponentialForResponse(address, ++count);
  }
}

describe('behavior of cloud function', function () {
  this.timeout(360000);

  before(async () => {
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
  });

  after(async () => {
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

  it('should get the correct website', async () => {
    await new Promise((r) => setTimeout(r, 4000));

    const body = await fetch(`${app}`);
    const res = await body.status;
    assert.strictEqual(res, 200);
  });

  it('should get the correct response', async () => {
    await new Promise((r) => setTimeout(r, 4000));
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
    await pingVMExponentialForResponse(`${app}/`, 1);

    body = await fetch(`${app}/`);
    res = await body.text();
    assert.ok(res.includes('how are you'));
  });
});
