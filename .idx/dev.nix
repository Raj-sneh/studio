{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [ "npm" "run" "dev" "--" "--port" "45577" "--hostname" "0.0.0.0" ];
        manager = "web";
      };
    };
  };
}
#refresh