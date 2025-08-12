/**
 * 데이터베이스 모델 통합 관리 파일
 * - Sequelize ORM을 사용하여 모든 데이터베이스 모델을 통합 관리
 * - 모델 간 관계 설정 및 초기화를 담당
 */

import { sequelize } from '../config/database.js';

// 상조팀장 관련 모델
import Manager from './manager/manager.js';
import ManagerForm from './manager/managerForm.js';
import ManagerFormBid from './manager/managerFormBid.js';
import ManagerAddDocument from './manager/managerAddDocument.js';
import ManagerCart from './manager/managerCart.js';
import ManagerCashHistory from './manager/managerCashHistory.js';
import ManagerPointHistory from './manager/managerPointHistory.js';
import ManagerCashRefundRequest from './manager/ManagerCashRefundRequest.js';

// 장례식장 관련 모델
import Funeral from './funeral/funeral.js';
import FuneralAddDocument from './funeral/funeralAddDocument.js';
import FuneralCashHistory from './funeral/funeralCashHistory.js';
import FuneralHallInfo from './funeral/funeralHallInfo.js';
import FuneralHallInfoImage from './funeral/funeralHallInfoImage.js';
import FuneralPointHistory from './funeral/funeralPointHistory.js';
import FuneralStaff from './funeral/funeralStaff.js';
import FuneralStaffPermission from './funeral/funeralStaffPermission.js';
import FuneralList from './funeral/funeralList.js';
import FuneralCashRefundRequest from './funeral/funeralCashRefundRequest.js';
import TermsAgreement from './common/TermsAgreement.js';
import FuneralListImage from './funeral/funeralListImage.js';
import FuneralPayment from './funeral/funeralPayment.js';

// 공통 모델
import DispatchRequest from './common/dispatchRequest.js';
import TransactionList from './common/transactionList.js';
import FcmToken from './common/fcmToken.js';
import NotificationHistory from './common/notificationHistory.js';

// 관리자 관련 모델
import Admin from './admin/admin.js';
import AdminStaff from './admin/adminStaff.js';
import Notice from './common/Notice.js';

const db = {};

db.sequelize = sequelize;

// 상조팀장 모델 등록
db.Manager = Manager;
db.ManagerForm = ManagerForm;
db.ManagerFormBid = ManagerFormBid;
db.ManagerAddDocument = ManagerAddDocument;
db.ManagerCart = ManagerCart;
db.ManagerCashHistory = ManagerCashHistory;
db.ManagerPointHistory = ManagerPointHistory;
db.ManagerCashRefundRequest = ManagerCashRefundRequest;

// 장례식장 모델 등록
db.Funeral = Funeral;
db.FuneralAddDocument = FuneralAddDocument;
db.FuneralCashHistory = FuneralCashHistory;
db.FuneralHallInfo = FuneralHallInfo;
db.FuneralHallInfoImage = FuneralHallInfoImage;
db.FuneralPointHistory = FuneralPointHistory;
db.FuneralStaff = FuneralStaff;
db.FuneralStaffPermission = FuneralStaffPermission;
db.FuneralList = FuneralList;
db.FuneralCashRefundRequest = FuneralCashRefundRequest;
db.TermsAgreement = TermsAgreement;
db.FuneralListImage = FuneralListImage;
db.FuneralPayment = FuneralPayment;

// 공통 모델 등록
db.DispatchRequest = DispatchRequest;
db.TransactionList = TransactionList;
db.FcmToken = FcmToken;
db.NotificationHistory = NotificationHistory;

// 관리자 모델 등록
db.Admin = Admin;
db.AdminStaff = AdminStaff;
db.Notice = Notice;

// 모델 초기화 - Sequelize 인스턴스와 연결
Object.values(db).forEach((model) => {
  if (model && typeof model.init === 'function') {
    model.init(sequelize);
  }
});

// 모델 간 관계 설정 - 외래키 및 연관 관계 정의
Object.values(db).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

export default db;
