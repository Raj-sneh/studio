
{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.python3
    pkgs.python3Packages.pip
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [ "npm" "run" "dev" ];
        manager = "web";
        env = {
          PORT = "3000";
        };
      };
    };
  };
}
