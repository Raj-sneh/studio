
{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  idx = {
    extensions = [
      "usernamehw.errorlens"
    ];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "-p" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
