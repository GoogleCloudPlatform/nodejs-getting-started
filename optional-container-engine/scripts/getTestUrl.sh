export TEST_URL=http://$(kubectl get services | awk '{ print $4 }' | grep -E "(\d|\.)+")
