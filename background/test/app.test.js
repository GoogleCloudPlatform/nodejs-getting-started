const cp = require('child_process');
const path = require('path');
const projectId = process.env.GCLOUD_PROJECT;
const regionId = process.env.REGION_ID;
const app = `https://testservice-dot-${projectId}.${regionId}.r.appspot.com`;
const {expect} = require('chai');
const {v4: uuidv4} = require('uuid');
const {Firestore} = require('@google-cloud/firestore');
const fetch = require('node-fetch');
const {URLSearchParams} = require('url');

describe('behavior of cloud function', function() {
  this.timeout(360000);
  const uniqueID = uuidv4().split('-')[0];

  before(() => {
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
      cp.execSync(`gcloud app deploy`, {
        cwd: path.join(__dirname, '../', 'server'),
      });
    } catch (err) {
      console.log("Wasn't able to deploy app to AppEngine");
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
    console.log('before deletion');
    const db = new Firestore({
      project: projectId,
    });
    await db
      .collection('/translations')
      .get()
      .then(res => {
        res.forEach(element => {
          element.ref.delete();
        });
      });
    console.log('after deletion');
  });

  it('should get the correct website', async () => {
    const body = await fetch(`${app}/`);
    const res = await body.status;
    console.log(res);
    expect(res).to.equal(200);
  });

  it('should get the correct response', async () => {
    const params = new URLSearchParams();
    params.append('lang', 'en');
    params.append('v', 'como estas');

    const body = await fetch(`${app}/request-translation`, {
      method: 'POST',
      body: params,
    });
    console.log(await body.text());
    const res = await body.status;
    expect(res).to.equal(200);
  });

  it("should now contain 'how are you'", async () => {
    await new Promise(r => setTimeout(r, 5000));

    const body = await fetch(`${app}/`);
    const res = await body.text();
    expect(res).to.include('how are you');
    console.log(res);
  });
});
