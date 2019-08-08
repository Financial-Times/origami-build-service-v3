provider "fastly" {
  version = "0.1.2"
}

resource "fastly_service_v1" "app" {}
