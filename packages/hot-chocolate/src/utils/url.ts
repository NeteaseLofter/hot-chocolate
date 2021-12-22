export const resolve = (
  origin: string,
  target: string
) => {
  if (/^((\w:\/\/)|(\/))/.test(target)) {
    return target;
  }
  let originArr = origin.split('/').slice(0, -1);
  let targetArr = target.split('/');

  let originIndent = 0;
  let targetIndex = 0;
  for (; targetIndex < targetArr.length; targetIndex++) {
    let targetStep = targetArr[targetIndex];
    if (targetStep === '..') {
      originIndent++;
    } else if (targetStep !== '.') {
      break;
    }
  }

  if (originIndent > 0) {
    originArr = originArr.slice(0, -originIndent)
  }
  targetArr = targetArr.slice(targetIndex);
  return originArr.join('/') + '/' + targetArr.join('/');
}
