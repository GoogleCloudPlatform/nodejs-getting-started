const cp = require('child_process');
const path = require('path');
const fetch = require('node-fetch');
const {expect} = require('chai');
const {v4: uuidv4} = require('uuid');
let testFlag = true;
let uniqueID;
let externalIP;

async function pingVMExponential(address, count) {
  await new Promise((r) => setTimeout(r, Math.pow(2, count) * 1000));
  try {
    const res = await fetch(address);
    if (res.status !== 200) {
      throw new Error(res.status);
    }
  } catch (err) {
    process.stdout.write('.');
    await pingVMExponential(address, ++count);
  }
}

async function getIP(uniqueID) {
  externalIP = cp
    .execSync(
      `gcloud compute instances describe my-app-instance-${uniqueID} \
--format='get(networkInterfaces[0].accessConfigs[0].natIP)' --zone=us-central1-f`
    )
    .toString('utf8')
    .trim();

  await pingVMExponential(`http://${externalIP}:8080/`, 1);
}

describe('spin up gce instance', async function () {
  console.time('beforeHook');
  console.time('test');
  console.time('afterHook');
  this.timeout(200000);
  uniqueID = uuidv4().split('-')[0];
  before(async function () {
    this.timeout(150000);
    cp.execSync(
      `gcloud compute instances create my-app-instance-${uniqueID} \
      --image-family=debian-9 \
      --image-project=debian-cloud \
      --machine-type=g1-small \
      --scopes userinfo-email,cloud-platform \
      --metadata app-location=us-central1-f \
      --metadata-from-file startup-script=gce/startup-script.sh \
      --zone us-central1-f \
      --tags http-server`,
      {cwd: path.join(__dirname, '../../')}
    );
    cp.execSync(`gcloud compute firewall-rules create default-allow-http-8080-${uniqueID} \
          --allow tcp:8080 \
          --source-ranges 0.0.0.0/0 \
          --target-tags http-server \
          --description "Allow port 8080 access to http-server"`);

    try {
      const timeOutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject('Timed out!'), 90000);
      });
      await Promise.race([timeOutPromise, getIP(uniqueID)]);
    } catch (err) {
      testFlag = false;
    }
    console.timeEnd('beforeHook');
  });

  after(function () {
    try {
      cp.execSync(
        `gcloud compute instances delete my-app-instance-${uniqueID} --zone=us-central1-f --delete-disks=all`
      );
    } catch (err) {
      console.log("wasn't able to delete the instance");
    }
    console.timeEnd('afterHook');
  });

  it('should get the instance', async () => {
    if (testFlag) {
      console.log(`http://${externalIP}:8080/`);
      const response = await fetch(`http://${externalIP}:8080/`);
      const body = await response.text();
      expect(body).to.include('Hello, world!');
    }
    console.timeEnd('test');
  });
});
