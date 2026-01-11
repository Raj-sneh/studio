
import ComposeLoader from './compose-loader';

/**
 * The entry point for the /compose route.
 * It uses a loader to dynamically import the client-side composer page,
 * which cannot be rendered on the server due to its use of browser APIs for audio.
 */
export default function ComposePage() {
  return <ComposeLoader />;
}
