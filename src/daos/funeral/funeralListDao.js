/**
 * 장례식장 목록 관리 DAO (Data Access Object)
 * - 장례식장의 목록 정보와 관련 이미지들을 관리하는 데이터베이스 작업을 담당합니다.
 * - 장례식장 목록 조회, 업데이트, 이미지 업로드/삭제 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 이모지를 사용하여 로그 메시지를 시각적으로 구분하여 디버깅을 용이하게 합니다.
 * - 장례식장의 서비스 목록과 이미지 자료를 체계적으로 관리합니다.
 * - 대량 이미지 처리를 위한 bulkCreate 기능을 지원합니다.
 */
import db from '../../models/index.js';

/**
 * 장례식장 목록 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장의 모든 목록 항목 조회
 * 2) findAll을 사용하여 해당 장례식장의 모든 서비스 목록 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array<Object>: 해당 장례식장의 모든 목록 항목 배열
 *
 * 예외:
 * - DB 조회 실패: 'Failed to retrieve funeral list from database: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장이 제공하는 서비스 목록을 조회할 때 사용됩니다.
 * - 반환값이 빈 배열인 경우 해당 장례식장의 서비스 목록이 없음을 의미합니다.
 * - 장례식장의 서비스 현황 파악과 관리에 활용됩니다.
 * - 서비스 목록의 상세 정보(가격, 설명, 상태 등)를 확인할 수 있습니다.
 * - 장례식장의 서비스 포트폴리오 관리에 필수적인 기능입니다.
 */
export const getFuneralList = async (funeralId) => {
  try {
    const funeralList = await db.FuneralList.findAll({
      where: {
        funeralId: funeralId,
      },
    });
    return funeralList;
  } catch (error) {
    throw new Error(`Failed to retrieve funeral list from database: ${error.message}`);
  }
};

/**
 * 장례식장 목록 항목 업데이트
 *
 * 입력:
 * - funeralId: string — 업데이트할 장례식장의 고유 ID
 * - updateData: Object — 업데이트할 데이터 객체
 *   - serviceName: string — 서비스명
 *   - price: number — 가격
 *   - description: string — 서비스 설명
 *   - status: string — 서비스 상태
 *   - 기타 업데이트할 필드들
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 목록 항목을 updateData로 업데이트
 * 2) 업데이트 성공 시 업데이트된 항목을 다시 조회하여 반환
 * 3) 업데이트할 항목이 없으면 오류 발생
 * 4) 🚀 이모지와 함께 업데이트 데이터를 로그로 출력
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object: 업데이트된 장례식장 목록 항목 정보
 *
 * 예외:
 * - 항목 없음: '장례식장 목록 항목을 찾을 수 없습니다' 형태로 Error throw
 * - DB 업데이트 실패: '장례식장 목록 항목 업데이트 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장의 서비스 정보를 수정할 때 사용됩니다.
 * - 🚀 이모지를 통해 업데이트 관련 로그를 시각적으로 구분할 수 있습니다.
 * - 업데이트 후 최신 정보를 반환하여 데이터 일관성을 보장합니다.
 * - 업데이트할 항목이 존재하지 않으면 명확한 오류 메시지를 제공합니다.
 * - 서비스 가격, 설명, 상태 등의 변경에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const updateFuneralById = async (funeralId, updateData) => {
  console.log('🚀 ~ updateFuneralById ~ updateData:', updateData);
  try {
    // Sequelize 모델이 FuneralList라고 가정합니다.
    const [updated] = await db.FuneralList.update(updateData, {
      where: { funeralId },
    });

    if (updated) {
      const updatedFuneral = await db.FuneralList.findOne({ where: { funeralId } });
      return updatedFuneral;
    }
    throw new Error('장례식장 목록 항목을 찾을 수 없습니다');
  } catch (error) {
    throw new Error(`장례식장 목록 항목 업데이트 실패: ${error.message}`);
  }
};

/**
 * 이미지 레코드 대량 생성
 *
 * 입력:
 * - imageRecords: Array<Object> — 생성할 이미지 레코드 배열
 *   - funeralListId: string — 관련 장례식장 목록 ID
 *   - imageUrl: string — 이미지 URL 또는 경로
 *   - imageType: string — 이미지 타입 (예: 'main', 'detail', 'gallery')
 *   - imageOrder: number — 이미지 순서
 *   - description: string — 이미지 설명 (선택사항)
 *   - 기타 필요한 필드들
 *
 * 동작:
 * 1) 입력받은 이미지 레코드 배열을 한 번에 데이터베이스에 생성
 * 2) bulkCreate를 사용하여 성능 최적화
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 이미지 기본 정보 (URL, 타입, 순서, 설명 등)
 * - 장례식장 목록과의 연관 관계
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Array<Object>: 생성된 이미지 레코드 배열
 *
 * 예외:
 * - DB 생성 실패: '이미지 레코드 생성 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장 서비스의 여러 이미지를 한 번에 등록할 때 사용됩니다.
 * - bulkCreate를 사용하여 개별 생성보다 훨씬 빠른 성능을 제공합니다.
 * - 이미지 순서를 지정하여 갤러리나 슬라이더에서 원하는 순서로 표시할 수 있습니다.
 * - 이미지 타입을 통해 메인 이미지, 상세 이미지 등을 구분할 수 있습니다.
 * - 트랜잭션 내에서 사용하여 데이터 일관성을 보장할 수 있습니다.
 * - 대량 이미지 업로드 시 성능 최적화에 필수적인 기능입니다.
 */
export const bulkCreateImages = async (imageRecords) => {
  try {
    return await db.FuneralListImage.bulkCreate(imageRecords);
  } catch (error) {
    throw new Error(`이미지 레코드 생성 실패: ${error.message}`);
  }
};

/**
 * 장례식장 목록 ID로 이미지 리스트 조회
 *
 * 입력:
 * - funeralListId: string — 조회할 장례식장 목록의 고유 ID
 *
 * 동작:
 * 1) funeralListId로 특정 장례식장 목록과 관련된 모든 이미지 조회
 * 2) 🚀 이모지와 함께 조회할 ID를 로그로 출력
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralListId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array<Object>: 해당 장례식장 목록의 모든 이미지 배열
 *
 * 예외:
 * - DB 조회 실패: '이미지 리스트 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장 서비스의 이미지들을 조회할 때 사용됩니다.
 * - 🚀 이모지를 통해 이미지 조회 관련 로그를 시각적으로 구분할 수 있습니다.
 * - 반환값이 빈 배열인 경우 해당 서비스의 이미지가 없음을 의미합니다.
 * - 이미지 갤러리, 슬라이더, 상세 페이지 등에서 활용됩니다.
 * - 이미지 순서를 통해 원하는 순서로 표시할 수 있습니다.
 * - 이미지 타입별로 필터링하여 특정 용도의 이미지만 사용할 수 있습니다.
 */
export const findImagesByFuneralListId = async (funeralListId) => {
  console.log('🚀 ~ findImagesByFuneralListId ~ funeralListId:', funeralListId);
  try {
    return await db.FuneralListImage.findAll({
      where: { funeralListId },
    });
  } catch (error) {
    throw new Error(`이미지 리스트 조회 실패: ${error.message}`);
  }
};

/**
 * 장례식장 목록 ID로 관련 이미지들 삭제
 *
 * 입력:
 * - funeralListId: string — 삭제할 이미지들이 속한 장례식장 목록의 고유 ID
 *
 * 동작:
 * 1) funeralListId로 특정 장례식장 목록과 관련된 모든 이미지 삭제
 * 2) destroy를 사용하여 조건에 맞는 모든 이미지 레코드 제거
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralListId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - undefined (반환값 없음)
 *
 * 예외:
 * - DB 삭제 실패: '이미지 삭제 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장 서비스를 삭제할 때 관련 이미지들을 함께 정리할 때 사용됩니다.
 * - destroy를 사용하여 조건에 맞는 모든 이미지를 한 번에 삭제합니다.
 * - 이미지 파일 자체는 별도로 삭제해야 할 수 있습니다 (파일 시스템 정리).
 * - 트랜잭션 내에서 사용하여 데이터 일관성을 보장할 수 있습니다.
 * - 삭제 후에는 해당 서비스의 이미지가 모두 제거됩니다.
 * - 이미지 삭제는 되돌릴 수 없으므로 신중하게 사용해야 합니다.
 * - 서비스 정보 삭제와 함께 이미지도 정리하여 데이터 무결성을 유지합니다.
 */
export const deleteImagesByFuneralListId = async (funeralListId) => {
  try {
    await db.FuneralListImage.destroy({
      where: { funeralListId },
    });
  } catch (error) {
    throw new Error(`이미지 삭제 실패: ${error.message}`);
  }
};
