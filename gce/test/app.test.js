
const cp = require('child_process');
const path = require('path');
const fetch = require('node-fetch');
const {expect} = require('chai');
const {v4: uuidv4} = require('uuid');

// Configuration Constants
const GCP_ZONE = 'us-central1-f';
const IMAGE_FAMILY = 'debian-12';
const IMAGE_PROJECT = 'debian-cloud';
const MACHINE_TYPE = 'g1-small';
const APP_PORT = '8080';
const STARTUP_SCRIPT_PATH = 'gce/startup-script.sh'; // Relative to project root
const MAX_PING_ATTEMPTS = 10;
const INITIAL_PING_DELAY_SECONDS = 2;

async function pingVMExponential(address, attempt = 1 ) {
  if (attempt > MAX_PING_ATTEMPTS) {
    throw new Error(`Failed to connect to ${address} after ${MAX_PING_ATTEMPTS} attempts.`);
  }
  const delaySeconds = Math.pow(INITIAL_PING_DELAY_SECONDS, attempt -1); 
  console.log(`Ping attempt ${attempt}/${MAX_PING_ATTEMPTS}: Waiting ${delaySeconds}s before pinging ${address}...`);
  await new Promise((r) => setTimeout(r, delaySeconds * 1000));

  try {
    const res = await fetch(address, { timeout: 15000 }); // Add a timeout to fetch itself
    if (res.status !== 200) {
      console.warn(`Ping attempt ${attempt} to ${address} failed with status: ${res.status}`);
      throw new Error(`Status: ${res.status}`);
    }
    console.log(`Successfully connected to ${address} on attempt ${attempt}.`);
    return true; 
  } catch (err) {
    process.stdout.write('.');
    if (attempt >= MAX_PING_ATTEMPTS) {
        console.error(`\nFinal ping attempt to ${address} failed: ${err.message}`);
        throw err; // Re-throw the error if max attempts reached
    }
    // Log the error for the current attempt but continue to retry
    // console.warn(`Ping attempt ${attempt} to ${address} caught error: ${err.message}. Retrying...`);
    return pingVMExponential(address, attempt + 1);
  }
}

async function getExternalIP(instanceName, zone) {
  try {
    // Retry a few times as IP address might take a moment to appear after instance is "RUNNING"
    for (let i = 0; i < 5; i++) {
        const ip = cp
        .execSync(
            `gcloud compute instances describe ${instanceName} --format='get(networkInterfaces[0].accessConfigs[0].natIP)' --zone=${zone}`
        )
        .toString('utf8')
        .trim();
        if (ip) return ip;
        console.log(`Attempt ${i+1} to get IP for ${instanceName}: IP not found yet. Waiting 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error(`Could not retrieve external IP for ${instanceName} after multiple attempts.`);
  } catch (error) {
    console.error(`Error getting external IP for ${instanceName}:`, error.message);
    throw error; // Re-throw to fail the calling function (e.g., before hook)
  }
}

describe('spin up gce instance', function () {
  // Increase timeout for the whole describe block if necessary,
  // but individual hooks/tests have their own timeouts.
  this.timeout(300000); // e.g., 5 minutes for the whole suite

  let uniqueID;
  let instanceName;
  let firewallRuleName;
  // 'this.externalIP' will be used to store the IP in the Mocha context

  before(async function () {
    this.timeout(240000); // Timeout for the before hook (e.g., 4 minutes)
    console.time('beforeHookDuration');

    uniqueID = uuidv4().split('-')[0];
    instanceName = `my-app-instance-${uniqueID}`;
    firewallRuleName = `default-allow-http-${APP_PORT}-${uniqueID}`;

    console.log(`Creating GCE instance: ${instanceName}`);
    try {
      cp.execSync(
        `gcloud compute instances create ${instanceName} \
          --image-family=${IMAGE_FAMILY} \
          --image-project=${IMAGE_PROJECT} \
          --machine-type=${MACHINE_TYPE} \
          --scopes userinfo-email,cloud-platform \
          --metadata app-location=${GCP_ZONE} \
          --metadata-from-file startup-script=${STARTUP_SCRIPT_PATH} \
          --zone ${GCP_ZONE} \
          --tags http-server`, // Keep a generic tag if startup script handles specific app setup
        { cwd: path.join(__dirname, '../../'), stdio: 'inherit' } // Show gcloud output
      );
      console.log(`Instance ${instanceName} created.`);

      console.log(`Creating firewall rule: ${firewallRuleName}`);
      cp.execSync(
        `gcloud compute firewall-rules create ${firewallRuleName} \
          --allow tcp:${APP_PORT} \
          --source-ranges 0.0.0.0/0 \
          --target-tags http-server \
          --description "Allow port ${APP_PORT} access for ${instanceName}"`,
        { stdio: 'inherit' }
      );
      console.log(`Firewall rule ${firewallRuleName} created.`);

      console.log('Attempting to get external IP...');
      this.externalIP = await getExternalIP(instanceName, GCP_ZONE);
      console.log(`Instance IP: ${this.externalIP}`);

      const appAddress = `http://${this.externalIP}:${APP_PORT}/`;
      console.log(`Pinging application at ${appAddress}...`);
      await pingVMExponential(appAddress); // pingVMExponential will throw on failure

      console.log('Setup complete.');
    } catch (err) {
      console.error('Error in "before" hook:', err.message);
      throw err; // Re-throw to make Mocha mark 'before' as failed
    } finally {
      console.timeEnd('beforeHookDuration');
    }
  });

  after(async function () {
    // 'after' hooks run even if 'before' or tests fail.
    this.timeout(120000); // Timeout for cleanup (e.g., 2 minutes)
    console.time('afterHookDuration');
    console.log('Starting cleanup...');

    await cleanupResources(instanceName, firewallRuleName, GCP_ZONE, this.externalIP);

    console.timeEnd('afterHookDuration');
  });

  // Helper for cleanup to be used in 'after' and potentially in 'before' catch block
  async function cleanupResources(instName, fwRuleName, zone, ip) {
    if (instName) {
      try {
        console.log(`Deleting GCE instance: ${instName}`);
        cp.execSync(
          `gcloud compute instances delete ${instName} --zone=${zone} --delete-disks=all --quiet`,
          { stdio: 'inherit' }
        );
        console.log(`Instance ${instName} deleted.`);
      } catch (err) {
        console.warn(`Warning: Wasn't able to delete instance ${instName}. Error: ${err.message}`);
        console.warn("You may need to delete it manually.");
      }
    }

    if (fwRuleName) {
      try {
        console.log(`Deleting firewall rule: ${fwRuleName}`);
        cp.execSync(`gcloud compute firewall-rules delete ${fwRuleName} --quiet`, { stdio: 'inherit' });
        console.log(`Firewall rule ${fwRuleName} deleted.`);
      } catch (err) {
        console.warn(`Warning: Wasn't able to delete firewall rule ${fwRuleName}. Error: ${err.message}`);
        console.warn("You may need to delete it manually.");
      }
    }
    // Optional: Release static IP if you were using one
    // if (ip && IS_STATIC_IP) { /* gcloud compute addresses delete ... */ }
  }

  it('should get the instance and verify content', async function() {
    this.timeout(30000); // Timeout for this specific test
    console.time('testExecutionTime');
    expect(this.externalIP, "External IP should be available").to.exist;

    const appUrl = `http://${this.externalIP}:${APP_PORT}/`;
    console.log(`Testing application at: ${appUrl}`);

    const response = await fetch(appUrl);
    expect(response.status, "Response status should be 200").to.equal(200);

    const body = await response.text();
    expect(body).to.include('Hello, world!');
    console.log('Test verification successful.');
    console.timeEnd('testExecutionTime');
  });

});