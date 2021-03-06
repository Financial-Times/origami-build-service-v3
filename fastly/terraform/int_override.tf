resource "fastly_service_v1" "app" {
  name = "Origami Build Service v3 Integration"

  domain {
    name = "origami-build-service-v3-dev.in.ft.com"
  }

  backend {
    name                  = "eu"
    address               = "oj8h4lckjk.execute-api.eu-west-1.amazonaws.com"
    port                  = 443
    ssl_cert_hostname     = "*.execute-api.eu-west-1.amazonaws.com"
    ssl_sni_hostname      = "oj8h4lckjk.execute-api.eu-west-1.amazonaws.com"
    auto_loadbalance      = false
    connect_timeout       = 5000
    first_byte_timeout    = 120000
    between_bytes_timeout = 120000
    error_threshold       = 0
    shield                = "london_city-uk"
  }

  backend {
    name                  = "eu_without_healthcheck"
    address               = "oj8h4lckjk.execute-api.eu-west-1.amazonaws.com"
    port                  = 443
    ssl_cert_hostname     = "*.execute-api.eu-west-1.amazonaws.com"
    ssl_sni_hostname      = "oj8h4lckjk.execute-api.eu-west-1.amazonaws.com"
    auto_loadbalance      = false
    connect_timeout       = 5000
    first_byte_timeout    = 120000
    between_bytes_timeout = 120000
    error_threshold       = 0
  }

  backend {
    name                  = "us"
    address               = "fc6opfckgj.execute-api.us-west-1.amazonaws.com"
    port                  = 443
    ssl_cert_hostname     = "*.execute-api.us-west-1.amazonaws.com"
    ssl_sni_hostname      = "fc6opfckgj.execute-api.us-west-1.amazonaws.com"
    auto_loadbalance      = false
    connect_timeout       = 5000
    first_byte_timeout    = 120000
    between_bytes_timeout = 120000
    error_threshold       = 0
    shield                = "dca-dc-us"
  }

  backend {
    name                  = "us_without_healthcheck"
    address               = "fc6opfckgj.execute-api.us-west-1.amazonaws.com"
    port                  = 443
    ssl_cert_hostname     = "*.execute-api.us-west-1.amazonaws.com"
    ssl_sni_hostname      = "fc6opfckgj.execute-api.us-west-1.amazonaws.com"
    auto_loadbalance      = false
    connect_timeout       = 5000
    first_byte_timeout    = 120000
    between_bytes_timeout = 120000
    error_threshold       = 0
  }

  header {
    name        = "EU Host"
    action      = "set"
    type        = "request"
    destination = "http.EU_Host"
    source      = "\"oj8h4lckjk.execute-api.eu-west-1.amazonaws.com\""
  }

  header {
    name        = "US Host"
    action      = "set"
    type        = "request"
    destination = "http.US_Host"
    source      = "\"fc6opfckgj.execute-api.us-west-1.amazonaws.com\""
  }

  vcl {
    name    = "prepend_path_with_lambda_stage.vcl"
    content = "sub prepend_path_with_lambda_stage {set bereq.url = \"/int\" bereq.url;}"
  }

  vcl {
    name    = "main.vcl"
    content = "${file("${path.module}/../vcl/main.vcl")}"
    main    = true
  }

  vcl {
    name    = "service.vcl"
    content = "${file("${path.module}/../vcl/service.vcl")}"
  }

  vcl {
    name    = "fastly-boilerplate-begin.vcl"
    content = "${file("${path.module}/../vcl/fastly-boilerplate-begin.vcl")}"
  }

  vcl {
    name    = "fastly-boilerplate-end.vcl"
    content = "${file("${path.module}/../vcl/fastly-boilerplate-end.vcl")}"
  }

  vcl {
    name    = "breadcrumbs.vcl"
    content = "${file("${path.module}/../vcl/breadcrumbs.vcl")}"
  }
}
