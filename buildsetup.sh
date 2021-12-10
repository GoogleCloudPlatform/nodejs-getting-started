#! /bin/bash

# This script will create Google Cloud Build Triggers
# if they do not exist on the existing project.

PROJECT=firestore-nodejs-getting-start
SERVICE_ACCOUNT=firestore-nodejs-getting-start@firestore-nodejs-getting-start.iam.gserviceaccount.com
echo "Creating triggers in $PROJECT"

# loop through all top level directories
for DIR in */
do
  # check if the directory contains a cloudbuild.yaml
  if test -f "$DIR/cloudbuild.yaml"; then
    # if it does, check to see if a trigger already exists
    echo "Checking for trigger on ${DIR%?}"
    gcloud beta builds triggers describe ci-${DIR%?} --project ${PROJECT} > /dev/null
    if [ $? -eq 0 ]
    then
      echo "Trigger already exists.  Moving on!"
    else
      echo "Creating trigger..."
      gcloud beta builds triggers create github \
        --repo-name nodejs-getting-started \
        --repo-owner GoogleCloudPlatform \
        --name ci-${DIR%?} \
        --service-account projects/${PROJECT}/serviceAccounts/${SERVICE_ACCOUNT} \
        --branch-pattern ^master$ \
        --build-config ${DIR}/cloudbuild.yaml \
        --project ${PROJECT}
    fi
  fi
done
