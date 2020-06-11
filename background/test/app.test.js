const superagent = require('superagent');
require('superagent-retry')(superagent);

const request = require('supertest');
const cp = require('child_process');
const path = require('path');
const projectId = process.env.GCLOUD_PROJECT;
const regionId = process.env.REGION_ID;
const app = `https://testservice-dot-${projectId}.${regionId}.r.appspot.com`;
const {expect} = require('chai');
const {v4: uuidv4} = require('uuid');

describe('behavior of cloud function', function() {
  this.timeout(240000);
  const uniqueID = uuidv4().split('-')[0];
  before(() => {
    cp.execSync(`npm install`, {cwd: path.join(__dirname, '../', 'function')});
    try {
      cp.execSync(
        `gcloud functions deploy translate-${uniqueID} --allow-unauthenticated --set-env-vars=unique_id=${uniqueID} --runtime nodejs8 --trigger-topic translate`,
        {cwd: path.join(__dirname, '../', 'function')}
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

  after(() => {
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
    try {
      cp.execSync(
        `firebase firestore:delete --project ${projectId} -r translations`
      );
    } catch (err) {
      console.log("Wasn't able to delete firestore project");
    }
  });

  it('should get the correct website', async () => {
    return await request(app)
      .get('/')
      .retry(5)
      .expect(200);
  });

  it('should ask for a translation', async () => {
    return await request(app)
      .post('/request-translation')
      .type('form')
      .send({lang: 'en', v: 'como estas'})
      .retry(5)
      .expect(200);
  });

  it("should now contain 'como estas'", async () => {
    return await request(app)
      .get('/')
      .set('Accept-Encoding', 'application/json')
      .retry(5)
      .end((err, res) => {
        expect(res.text.includes('como estas'));
      });
  });
});
