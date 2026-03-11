{ pkgs }:

{
  deps = [
    pkgs.nodejs_20
    pkgs.bun
    pkgs.chromium
  ];

  env = {
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PLAYWRIGHT_CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";
    PLAYWRIGHT_BROWSERS_PATH = "0";
  };
}
