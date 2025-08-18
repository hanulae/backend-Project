/**
 * 장례식장 목록 관리 서비스
 * - 장례식장의 기본 정보와 연관된 이미지 파일들을 관리하는 기능을 제공합니다.
 * - 장례식장 목록 조회, 정보 업데이트, 이미지 CRUD 작업을 수행합니다.
 * - 이미지 파일은 별도 테이블에 저장되며, 장례식장 정보와 funeralListId로 연결됩니다.
 */
import * as funeralListDao from '../../daos/funeral/funeralListDao.js';

/**
 * 장례식장 목록 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 ID
 *
 * 동작:
 * 1) DAO를 통해 해당 장례식장의 목록 정보 조회
 * 2) 조회된 목록의 첫 번째 항목에서 funeralListId 추출
 * 3) funeralListId를 사용하여 연관된 이미지 파일들 조회
 * 4) 장례식장 목록과 이미지 정보를 객체로 구성하여 반환
 *
 * 데이터 구조:
 * - funeralList: 장례식장의 기본 정보 배열
 * - images: 해당 장례식장과 연관된 이미지 파일 배열
 *
 * 반환:
 * - Object: { funeralList, images }
 *   - funeralList: Array<FuneralList> — 장례식장 목록 정보
 *   - images: Array<Image> — 연관된 이미지 파일들
 *
 * 예외:
 * - 조회 실패: 'Failed to retrieve funeral list: {오류메시지}' 형태로 Error throw
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 참고:
 * - 현재 console.log로 디버깅 정보를 출력하고 있습니다.
 * - 향후 프로덕션 환경에서는 로깅 레벨을 조정하는 것을 권장합니다.
 */
export const getFuneralList = async (funeralId) => {
  try {
    const funeralList = await funeralListDao.getFuneralList(funeralId);
    console.log('🚀 ~ getFuneralList ~ funeralList:', funeralList);
    const funeralListId = funeralList[0].funeralListId;
    console.log('🚀 ~ getFuneralList ~ funeralList:', funeralListId);

    const images = await funeralListDao.findImagesByFuneralListId(funeralListId);
    console.log('🚀 ~ getFuneralList ~ images:', images);
    return {
      funeralList,
      images,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve funeral list: ${error.message}`);
  }
};

/**
 * 장례식장 목록 정보 업데이트
 *
 * 입력:
 * - funeralId: string — 업데이트할 장례식장의 ID
 * - updateData: Object — 업데이트할 데이터 객체
 *   - funeralRoomFiles: Array<string> — 새로운 이미지 파일 URL 배열 (선택사항)
 *
 * 동작:
 * 1) DAO를 통해 장례식장 기본 정보 업데이트
 * 2) 기존에 연관된 모든 이미지 파일 삭제
 * 3) 새로운 이미지 파일이 제공된 경우 bulk insert로 저장
 * 4) 업데이트된 장례식장 정보와 새로운 이미지 목록 조회
 * 5) 업데이트 결과와 이미지 정보를 객체로 구성하여 반환
 *
 * 이미지 처리 과정:
 * - 기존 이미지: funeralListId 기준으로 모든 이미지 삭제
 * - 새로운 이미지: updateData.funeralRoomFiles 배열의 각 URL을 이미지 레코드로 변환
 * - 이미지 레코드 구조: { funeralListId, imageUrl }
 *
 * 반환:
 * - Object: { updatedFuneral, images }
 *   - updatedFuneral: FuneralList — 업데이트된 장례식장 정보
 *   - images: Array<Image> — 새로 저장된 이미지 파일들
 *
 * 예외:
 * - 업데이트 실패: '장례식장 목록 항목 업데이트 실패: {오류메시지}' 형태로 Error throw
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 참고:
 * - 이미지 파일이 없는 경우에도 기존 이미지는 삭제됩니다.
 * - 이미지 업데이트는 전체 교체 방식으로 동작합니다 (부분 업데이트 불가).
 * - 트랜잭션 처리가 필요할 수 있으므로, 향후 데이터 정합성 보장을 위해 고려해볼 수 있습니다.
 */
export const updateFuneralList = async (funeralId, updateData) => {
  try {
    const updatedFuneral = await funeralListDao.updateFuneralById(funeralId, updateData);

    // 기존 이미지 삭제
    await funeralListDao.deleteImagesByFuneralListId(updatedFuneral.funeralListId);

    // 새로운 이미지 저장
    if (updateData.funeralRoomFiles) {
      const imageRecords = updateData.funeralRoomFiles.map((url) => ({
        funeralListId: updatedFuneral.funeralListId,
        imageUrl: url,
      }));
      await funeralListDao.bulkCreateImages(imageRecords);
    }

    // 이미지 리스트 조회
    const images = await funeralListDao.findImagesByFuneralListId(updatedFuneral.funeralListId);

    return {
      updatedFuneral,
      images,
    };
  } catch (error) {
    throw new Error(`장례식장 목록 항목 업데이트 실패: ${error.message}`);
  }
};
