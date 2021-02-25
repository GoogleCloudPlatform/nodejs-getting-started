const cp = require('child_process');
const path = require('path');
const fetch = require('node-fetch');
const {expect} = require('chai');
const {v4: uuidv4} = require('uuid');

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

describe('spin up gce instance', function () {
  this.timeout(5000000);

  const uniqueID = uuidv4().split('-')[0];
  before(() => {
    this.timeout(5000000);
    try {
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
    } catch (err) {
      console.log("wasn't able to create the VM instance");
    }
    try {
      cp.execSync(`gcloud compute firewall-rules create default-allow-http-8080-${uniqueID} \
          --allow tcp:8080 \
          --source-ranges 0.0.0.0/0 \
          --target-tags http-server \
          --description "Allow port 8080 access to http-server"`);
    } catch (err) {
      console.log("wasn't able to create the firewall rule");
    }
  });

  after(() => {
    try {
      cp.execSync(
        `gcloud compute instances delete my-app-instance-${uniqueID} --zone=us-central1-f --delete-disks=all`
      );
    } catch (err) {
      console.log("wasn't able to delete the instance");
    }
  });

  it('should get the instance', async () => {
    const externalIP = cp
      .execSync(
        `gcloud compute instances describe my-app-instance-${uniqueID} \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)' --zone=us-central1-f`
      )
      .toString('utf8')
      .trim();

    await pingVMExponential(`http://${externalIP}:8080/`, 1);

    console.log(`http://${externalIP}:8080/`);
    const response = await fetch(`http://${externalIP}:8080/`);
    const body = await response.text();
    expect(body).to.include('Hello, world!');
  });
});
