# Origami Service Makefile
# ------------------------
# This section of the Makefile should not be modified, it includes
# commands from the Origami service Makefile.
# https://github.com/Financial-Times/origami-service-makefile
include node_modules/@financial-times/origami-service-makefile/index.mk
# [edit below this line]
# ------------------------

prettier:
	@prettier --write "{lib/**/*.js,test/**/*.js,*.js,.*.js}"

# Configuration
# -------------

INTEGRATION_TIMEOUT = 10000
INTEGRATION_SLOW = 2000

SERVICE_NAME = Origami Build Service V3
SERVICE_SYSTEM_CODE = origami-build-service-v3
SERVICE_SALESFORCE_ID = Origami Build Service V3

HEROKU_APP_QA = origami-build-service-v3-qa
HEROKU_APP_EU = origami-build-service-v3-eu
HEROKU_APP_US = origami-build-service-v3-us
GRAFANA_DASHBOARD = origami-build-service-v3

export GITHUB_RELEASE_REPO := Financial-Times/origami-build-service-v3
