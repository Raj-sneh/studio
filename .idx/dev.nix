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
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
    ];
    workspace = {
      onCreate = {
        npm-install = "npm install";
        python-setup = "pip install librosa numpy soundfile elevenlabs python-dotenv";
      };
      onStart = {
        # Start the FastAPI voice engine in the background
        start-voice-engine = "python main.py &";
      };
    };
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