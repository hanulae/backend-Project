/**
 * UUID 형식을 검증하는 미들웨어 생성 함수
 * @param {string|string[]} paramNames - 검증할 파라미터 이름 또는 이름 배열
 * @param {string} source - req 객체의 어느 부분에서 파라미터를 찾을지 확인 ('body', 'query', 'params' 등등)
 * @returns {Function} - Express 미들웨어
 */
export const validateUUID = (paramNames, source = 'body') => {
  const paramArray = Array.isArray(paramNames) ? paramNames : [paramNames];

  return (req, res, next) => {
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    for (const param of paramArray) {
      const value = req[source][param];

      // 값이 없다면 다음 파라미터로 넘김
      if (!value) continue;

      // 배열인 경우 각 요소를 개별적으로 검증
      if (Array.isArray(value)) {
        for (const item of value) {
          if (!uuidPattern.test(item)) {
            console.log('배열 내 잘못된 UUID:', item);
            return res.status(400).json({
              success: false,
              message: `${param} 배열 내 "${item}"은 유효한 UUID 형식이 아님`,
              value: item,
            });
          }
        }
      } else {
        // 단일 값인 경우 기존 로직
        if (!uuidPattern.test(value)) {
          console.log('잘못된 UUID:', value);
          return res.status(400).json({
            success: false,
            message: `${param}은 유효한 UUID 형식이 아님`,
            value,
          });
        }
      }
    }
    next();
  };
};

/**
 * 필수 필드를 검증하는 미들웨어 생성 함수
 * @param {string|string[]} paramNames - 검증할 파라미터 이름 또는 이름 배열
 * @param {string} source - req 객체의 어느 부분에서 파라미터를 찾을지 확인 ('body', 'query', 'params' 등등)
 * @returns {Function} - Express 미들웨어
 */
export const validateRequiredFields = (paramNames, source = 'body') => {
  const paramArray = Array.isArray(paramNames) ? paramNames : [paramNames];

  return (req, res, next) => {
    for (const param of paramArray) {
      if (
        req[source][param] === undefined ||
        req[source][param] === null ||
        req[source][param] === ''
      ) {
        return res.status(400).json({
          success: false,
          message: `${param} 필드는 필수입니다.`,
        });
      }
    }

    next();
  };
};
