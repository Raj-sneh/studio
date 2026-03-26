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
      "mongodb.mongodb-vscode"
      "ms-python.python"
    ];
    previews = {
      enable = true;
      previews = {
        web = {
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port"
            "$PORT"
            "--hostname"
            "0.0.0.0"
          ];
          manager = "web";
        };
      };
    };
  };
}