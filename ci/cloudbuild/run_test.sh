#!/bin/bash
#
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# `-e` enables the script to automatically fail when a command fails
# `-o pipefail` sets the exit code to the rightmost comment to exit
# with a non-zero
set -eo pipefail

# In cloudbuild, the current directory is the project root.
export PROJECT_ROOT=$(pwd)

# A script file for running the test in a sub project.
test_script="${PROJECT_ROOT}/ci/cloudbuild/run_single_test.sh"

# btlr binary
btlr_bin="${PROJECT_ROOT}/ci/btlr"

if [ ${BUILD_TYPE} == "presubmit" ]; then

    # First run lint and exit early upon failure
    npm install
    npm run lint

    # For presubmit build, we want to know the difference from the
    # common commit in origin/main.
    GIT_DIFF_ARG="origin/main..."

    # Then fetch enough history for finding the common commit.
    git fetch origin main --deepen=200

elif [ ${BUILD_TYPE} == "continuous" ]; then
    # For continuous build, we want to know the difference in the last
    # commit. This assumes we use squash commit when merging PRs.
    GIT_DIFF_ARG="HEAD~.."

    # Then fetch one last commit for getting the diff.
    git fetch origin main --deepen=1

else
    # Run everything.
    GIT_DIFF_ARG=""
fi

# Then detect changes in the test scripts and Dockerfile.

set +e
git diff --quiet ${GIT_DIFF_ARG} ci/cloudbuild
changed=$?
set -e
if [[ "${changed}" -eq 0 ]]; then
    echo "no change detected in ci/cloudbuild"
else
    echo "change detected in ci/cloudbuild, we should test everything"
    GIT_DIFF_ARG=""
fi

# Now we have a fixed list, but we can change it to autodetect if
# necessary.

subdirs=(
    authenticating-users
    background
    bookshelf
    gce
    sessions
)

dirs_to_test=()

for d in ${subdirs[@]}; do
    if [ -n "${GIT_DIFF_ARG}" ]; then
	echo "checking changes with 'git diff --quiet ${GIT_DIFF_ARG} ${d}'"
	set +e
	git diff --quiet ${GIT_DIFF_ARG} ${d}
	changed=$?
	set -e
	if [[ "${changed}" -eq 0 ]]; then
	    echo "no change detected in ${d}, skipping"
	else
	    echo "change detected in ${d}"
	    dirs_to_test+=(${d})
	fi
    else
	# If GIT_DIFF_ARG is empty, run all the tests.
	dirs_to_test+=(${d})
    fi
done

if [ ${#dirs_to_test[@]} -gt 0 ]; then
    ${btlr_bin} run ${dirs_to_test[@]} -- ${test_script}
else
    echo "Nothing changed in the samples"
fi
