export async function loadScriptAsText (remoteScriptUrl: string) {
  const response = await fetch(remoteScriptUrl);
  const scriptText = await response.text();

  return scriptText;
}

export async function loadRemoteAsText (remoteUrl: string) {
  const response = await fetch(remoteUrl);
  const scriptText = await response.text();

  return scriptText;
}
