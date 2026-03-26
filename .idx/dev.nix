{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.ffmpeg
    pkgs.sox
    (pkgs.python311.withPackages (ps: with ps; [
      flask
      flask-cors
      gunicorn
      requests
      librosa
      numpy
      scipy
      fastapi
      uvicorn
      python-multipart
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
        # Your backend configuration
        backend = {
          command = [
            "python3"
            "main.py"
          ];
          manager = "web";
        };
      };
    };
  };
}