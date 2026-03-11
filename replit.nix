{ pkgs }:
{
  deps = [
    pkgs.nodejs_20
    pkgs.bun
    pkgs.chromium

    # playwright runtime deps
    pkgs.libgbm
    pkgs.glib
    pkgs.nss
    pkgs.at-spi2-atk
    pkgs.at-spi2-core
    pkgs.dbus
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libxkbcommon
    pkgs.xorg.libXrandr
    pkgs.mesa
    pkgs.pango
    pkgs.cairo
  ];

  env = {
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PLAYWRIGHT_BROWSERS_PATH = "0";
    PLAYWRIGHT_CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";
  };
}
