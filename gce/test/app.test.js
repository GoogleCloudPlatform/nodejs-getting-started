const superagent = require('superagent');
require('superagent-retry')(superagent);

const request = require('supertest');
const cp = require('child_process');
const path = require('path');
const projectId = process.env.PROJECT_ID;

//in kokoro, need to set project id, auth, and region ID
//use gcloud and firebase cli
//how to get cleanup to wait
describe('spin up gce instance', function() {
    this.timeout(240000);
    //   cp.execSync(
  //     `gcloud compute instances create my-app-instance \
  //       --image-family=debian-9 \
  //       --image-project=debian-cloud \
  //       --machine-type=g1-small \
  //       --scopes userinfo-email,cloud-platform \
  //       --metadata app-location=us-central1-f \
  //       --metadata-from-file startup-script=gce/startup-script.sh \
  //       --zone us-central1-f \
  //       --tags http-server`,
  //     {cwd: path.join(__dirname, '../../')}
  //   );

  //   let isReady = cp
  //     .execSync(
  //       `gcloud compute instances get-serial-port-output my-app-instance --zone us-central1-f`
  //     )
  //     .toString('utf8');

  //   console.log(isReady.includes('Finished running startup scripts'));

  //   console.log(isReady.includes('Finished running startup scripts'));

  before(() => {
    this.timeout(240000);
    cp.execSync(`gcloud config set project ${projectId}`);
    try {
      cp.execSync(
        `gcloud compute instances create my-app-instance \
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
      cp.execSync(`gcloud compute firewall-rules create default-allow-http-8080 \
          --allow tcp:8080 \
          --source-ranges 0.0.0.0/0 \
          --target-tags http-server \
          --description "Allow port 8080 access to http-server"`);
    } catch (err) {
      console.log("wasn't able to create the firewall rule");
    }
  });
//   after(() => {
//     this.timeout(240000);
//     cp.execSync(
//       `gcloud compute instances delete my-app-instance --zone=us-central1-f --delete-disks=all`
//     );
//     cp.execSync(`gcloud compute firewall-rules delete default-allow-http-8080`);
//   });

  it('should get the instance', async() => {
    const externalIP = cp
      .execSync(
        `gcloud compute instances describe my-app-instance \
      --format='get(networkInterfaces[0].accessConfigs[0].natIP)' --zone=us-central1-f`
      )
      .toString('utf8');
    console.log(`http://${externalIP}:8080`)
    return await request(`http://${externalIP}:8080`)
      .get('/')
      .retry(20)
      .expect(200);
  });
});
