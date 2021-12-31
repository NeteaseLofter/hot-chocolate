export const resolve = (
  origin: string,
  target: string
) => {
  console.log('--猜测是这里')
  if (/^((\w:\/\/)|(\/))/.test(target)) {
    return target;
  }
  console.log('window-origin', window.location.pathname);
  let originArr
  if (window.location.pathname.includes ('/app/arch/commons/'))
  {
     console.log('特殊处理一下')
     originArr = window.location.pathname.split('/').slice(0, -1);
  }
  else {
    console.log('第一次好像走的是这个')
    originArr = origin.split('/').slice(0, -1);
  }
  let targetArr = target.split('/');
  console.log('originArr', originArr, 'targetArr', targetArr);
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
  console.log('处理后的结果', originArr.join('/') + '/' + targetArr.join('/'));
  return originArr.join('/') + '/' + targetArr.join('/');
}
