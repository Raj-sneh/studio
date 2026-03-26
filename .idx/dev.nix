{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.ffmpeg
    pkgs.sox

    (pkgs.python311.withPackages (ps: with ps; [
      fastapi
      uvicorn
      python-multipart
      requests
    ]))
  ];
  idx = {
    extensions = [
      "ms-python.python"
      "ms-ceintl.vscode-language-pack-en"
    ];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}