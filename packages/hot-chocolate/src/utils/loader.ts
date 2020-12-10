export async function loadScriptAsText (remoteScriptUrl: string) {
  const response = await fetch(remoteScriptUrl);
  const scriptText = await response.text();

  return scriptText;
}

