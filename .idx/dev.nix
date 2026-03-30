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
        # This builds your environment. It takes a few minutes.
        setup = ''
          npm install
          python -m venv .venv
          ./.venv/bin/pip install fastapi uvicorn requests python-dotenv firebase-admin razorpay flask-cors elevenlabs numpy soundfile librosa
        '';
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          # This starts ONLY Next.js. We will start Python manually.
          command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
  };
}