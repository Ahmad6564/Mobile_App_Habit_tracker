import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

// Required for the auth session popup to close and hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

/**
 * True only when the current platform's OAuth client ID is present. expo's
 * `Google.useAuthRequest` throws a synchronous invariant if the client ID for
 * the running platform is missing, so callers must check this BEFORE mounting a
 * component that calls `useGoogleSignIn`.
 */
export function isGoogleConfigured(): boolean {
  const id = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  return !!id;
}

type Handlers = {
  onToken: (idToken: string) => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
};

/**
 * Wraps expo-auth-session's Google provider. Returns `promptAsync` to launch the
 * consent screen and `ready` (false until the request is built / when no client
 * IDs are configured). The Google ID token is delivered via `onToken`.
 *
 * Client IDs come from mobile/.env:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID / _IOS_CLIENT_ID / _ANDROID_CLIENT_ID
 */
export function useGoogleSignIn(handlers: Handlers) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Keep the latest callbacks without re-running the response effect each render.
  const cbRef = useRef(handlers);
  cbRef.current = handlers;

  useEffect(() => {
    if (!response) return;
    const { onToken, onError, onCancel } = cbRef.current;

    if (response.type === "success") {
      const idToken =
        (response.params as Record<string, string> | undefined)?.id_token ??
        response.authentication?.idToken ??
        null;
      if (idToken) onToken(idToken);
      else onError?.("Google did not return an ID token. Check your OAuth client configuration.");
    } else if (response.type === "error") {
      onError?.(response.error?.message ?? "Google sign-in failed. Please try again.");
    } else if (response.type === "cancel" || response.type === "dismiss") {
      onCancel?.();
    }
  }, [response]);

  return { promptAsync, ready: !!request };
}
