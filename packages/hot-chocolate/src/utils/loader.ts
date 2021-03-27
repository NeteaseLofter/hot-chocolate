export async function loadRemoteAsText (remoteUrl: string) {
  const response = await fetch(remoteUrl);
  const scriptText = await response.text();

  return scriptText;
}
