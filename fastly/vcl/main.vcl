import querystring;

# The Fastly VCL boilerplate.
include "fastly-boilerplate-begin.vcl";

include "breadcrumbs.vcl";
include "service.vcl";

# Finally include the last bit of VCL, this _must_ be last!
include "fastly-boilerplate-end.vcl";
