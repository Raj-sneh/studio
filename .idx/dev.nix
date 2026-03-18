{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  idx = {
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "-p" "9001"];
          manager = "web";
          env = {
            PORT = "9001";
          };
        };
      };
    };
  };
}
