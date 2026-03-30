{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.ffmpeg
    pkgs.sox
  ];
  idx = {
    extensions = [
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
    ];
    workspace = {
      onCreate = {
        # 1. Install Node dependencies
        npm-install = "npm install";
        
        # 2. Create Python virtual environment and install ALL libraries
        # This avoids the "externally-managed-environment" and "undefined variable" errors
        python-setup = ''
          python -m venv .venv
          source .venv/bin/activate
          pip install fastapi uvicorn python-multipart requests librosa numpy soundfile elevenlabs python-dotenv firebase-admin razorpay flask-cors
        '';
      };
      onStart = {
        # Start the Python engine using the version inside our virtual environment
        start-voice-engine = "./.venv/bin/python main.py &";
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