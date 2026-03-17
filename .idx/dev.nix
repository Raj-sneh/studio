{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.psmisc 
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev" "--" "--port" "9000" "--hostname" "0.0.0.0"];
        manager = "web";
      };
    };
  };
}
#refresh