/* eslint-disable */
import xlsx from 'xlsx';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// 현재 디렉토리 경로 설정
const __dirname = path.resolve();

// 환경 변수 설정 확인
process.env.NODE_ENV = 'development';

// 환경 변수 로드
dotenv.config({
  path: path.join(__dirname, '.env.development'),
});

// 모든 모델 및 데이터베이스 초기화
const initializeDatabase = async () => {
  const { sequelize } = await import('./src/config/database.js');
  await import('./src/models/index.js');
  const { default: FuneralList } = await import('./src/models/funeral/funeralList.js');
  return { sequelize, FuneralList };
};

async function importFuneralList(mode = 'update') {
  try {
    // 데이터베이스 및 모델 초기화
    const { sequelize, FuneralList } = await initializeDatabase();

    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 엑셀 파일 로드
    const workbook = xlsx.readFile(path.join(__dirname, '장례식장_데이터.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`총 ${data.length}개의 데이터 로드 완료`);

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      // 모드가 'truncate'인 경우 기존 데이터 모두 삭제
      if (mode === 'truncate') {
        console.log('기존 데이터 삭제 중...');
        await FuneralList.destroy({
          where: {},
          truncate: true,
          transaction,
        });
        console.log('기존 데이터 삭제 완료');
      }

      // 배치 사이즈 정의
      const batchSize = 100;

      // 데이터 처리
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));
        const funeralListData = batch.map((row) => {
          // 기본 키 생성 또는 기존 키 사용 (업데이트 시 필요)
          const uniqueName =
            row['이름'] && row['주소'] ? `${row['이름']}_${row['주소']}` : uuidv4();

          return {
            funeralListId: uuidv4(), // 신규 데이터일 경우만 사용됨
            funeralRegion: row['시/도'] || '',
            funeralCity: row['시/구/군'] || '',
            funeralName: row['이름'] || '',
            funeralAddress: row['주소'] || '',
            funeralScale: row['규모'] || '',
            funeralTotalRooms: row['빈소'] ? parseInt(row['빈소']) : 0,
            funeralOperationType: row['운영'] || '',
            funeralStyle: row['형태'] || '',
            funeralParkingLot: row['주차장'] == 1 || row['주차장'] === '1' || row['주차장'] === 'Y',
            funeralStore: row['매점'] == 1 || row['매점'] === '1' || row['매점'] === 'Y',
            funeralFamilyWaitingRoom:
              row['유족대기실'] == 1 || row['유족대기실'] === '1' || row['유족대기실'] === 'Y',
            funeralDisabledFacility:
              row['장애인시설'] == 1 || row['장애인시설'] === '1' || row['장애인시설'] === 'Y',
            funeralIsJoin: false,
            funeralSearchKeywords: `${row['이름']} ${row['시/도']} ${row['시/구/군']}`,
            uniqueName, // 업데이트 식별용 임시 필드
          };
        });

        if (mode === 'update') {
          // upsert 모드: 업데이트 또는 추가
          for (const item of funeralListData) {
            const { uniqueName, ...dataToUpsert } = item;

            // 이름과 주소로 기존 데이터 찾기
            const existingFuneral = await FuneralList.findOne({
              where: {
                funeralName: item.funeralName,
                funeralAddress: item.funeralAddress,
              },
              transaction,
            });

            if (existingFuneral) {
              // 기존 데이터 업데이트
              await existingFuneral.update(dataToUpsert, { transaction });
            } else {
              // 새 데이터 생성
              await FuneralList.create(dataToUpsert, { transaction });
            }
          }
        } else {
          // truncate 모드: 새 데이터 벌크 생성
          const cleanedData = funeralListData.map(({ uniqueName, ...data }) => data);
          await FuneralList.bulkCreate(cleanedData, { transaction });
        }

        console.log(`${i + batch.length}/${data.length} 데이터 처리 완료`);
      }

      // 트랜잭션 커밋
      await transaction.commit();
      console.log('모든 데이터 처리 완료');
    } catch (error) {
      // 오류 발생 시 롤백
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('데이터 가져오기 오류:', error);
  }
}

// 스크립트 실행 - 인자로 'truncate' 또는 'update' 사용
// 'truncate': 모든 데이터 삭제 후 다시 생성
// 'update': 존재하는 데이터는 업데이트, 없는 데이터는 추가
const mode = process.argv[2] || 'update';
console.log(`실행 모드: ${mode}`);
importFuneralList(mode);
