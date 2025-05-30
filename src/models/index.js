import { sequelize } from '../config/database.js';
import Manager from './manager/manager.js';
import ManagerForm from './manager/managerForm.js';
import ManagerFormBid from './manager/managerFormBid.js';
import ManagerAddDocument from './manager/managerAddDocument.js';
import ManagerCart from './manager/managerCart.js';
import ManagerCashHistory from './manager/managerCashHistory.js';
import ManagerPointHistory from './manager/managerPointHistory.js';
import ManagerCashRefundRequest from './manager/ManagerCashRefundRequest.js';

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

import DispatchRequest from './common/dispatchRequest.js';
import TransactionList from './common/transactionList.js';

import Admin from './admin/admin.js';
import AdminStaff from './admin/adminStaff.js';

const db = {};

db.sequelize = sequelize;

// 모델 등록
db.Manager = Manager;
db.ManagerForm = ManagerForm;
db.ManagerFormBid = ManagerFormBid;
db.ManagerAddDocument = ManagerAddDocument;
db.ManagerCart = ManagerCart;
db.ManagerCashHistory = ManagerCashHistory;
db.ManagerPointHistory = ManagerPointHistory;
db.ManagerCashRefundRequest = ManagerCashRefundRequest;

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

db.DispatchRequest = DispatchRequest;
db.TransactionList = TransactionList;

db.Admin = Admin;
db.AdminStaff = AdminStaff;

// 모델 초기화
Object.values(db).forEach((model) => {
  if (model && typeof model.init === 'function') {
    model.init(sequelize);
  }
});

// 모델 간 관계 설정
Object.values(db).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

export default db;
