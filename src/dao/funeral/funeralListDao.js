/**
 * 파일명: funeralListDao.js
 * 설명: 장례식장 리스트 관련 데이터베이스 접근 객체
 * 장례식장 기본 정보와 호실 관리 관련 기능을 제공합니다.
 */

import FuneralList from '../../models/funeral/funeralList.js';
import Funeral from '../../models/funeral/funeral.js';
import { sequelize } from '../../config/database.js';
import FuneralStaff from '../../models/funeral/funeralStaff.js';
import Manager from '../../models/manager/manager.js';

const funeralListDao = {
  /**
   * 장례식장 리스트 ID를 통한 장례식장 ID 조회
   *
   * 장례식장 리스트 ID를 기반으로 해당 장례식장의 ID를 조회합니다.
   *
   * @param {string} funeralListId - 장례식장 리스트 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Array<Object>>} 장례식장 ID 정보를 포함한 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getFuneralIdByFuneralListId(funeralListId, options = {}) {
    const result = await FuneralList.findAll({
      where: { funeralListId: funeralListId },
      attributes: ['funeralListId', 'funeralId'],
      ...options,
    });
    return result;
  },

  /**
   * 장례식장 정보 업데이트 함수
   *
   * 특정 장례식장의 정보를 업데이트합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @param {Object} updateData - 업데이트할 데이터 객체
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
   */
  async updateFuneralList(funeralId, updateData, options = {}) {
    const result = await FuneralList.update(updateData, {
      where: { funeralId: funeralId },
      ...options,
    });
    return result;
  },

  /**
   * 장례식장 호실 갯수 증가
   *
   * 장례식장의 호실 갯수를 증가시킵니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @param {number} increment - 증가할 호실 갯수 (기본값: 1)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
   */
  async incrementFuneralTotalRooms(funeralId, increment = 1, options = {}) {
    return this.updateFuneralList(funeralId, {
      funeralTotalRooms: sequelize.literal(`funeral_total_rooms + ${increment}`),
      ...options,
    });
  },

  /**
   * 장례식장 호실 갯수 감소
   *
   * 장례식장의 호실 갯수를 감소시킵니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @param {number} decrement - 감소할 호실 갯수 (기본값: 1)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
   */
  async decrementFuneralTotalRooms(funeralId, decrement = 1, options = {}) {
    return this.updateFuneralList(funeralId, {
      funeralTotalRooms: sequelize.literal(`funeral_total_rooms - ${decrement}`),
      ...options,
    });
  },
  /**
   * 장례식장 정보 조회
   *
   * 장례식장 ID를 기반으로 해당 장례식장의 정보를 조회합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Object>} 장례식장 정보를 포함한 객체
   * @throws {Error} 조회 실패 시 발생
   */
  async getFuneralById(funeralId) {
    const result = await Funeral.findOne({
      where: { funeralId: funeralId },
      attributes: ['funeralPhoneNumber'],
    });
    return result;
  },

  /**
   * 장례식장 직원 전화번호 목록 조회
   *
   * 장례식장 ID를 기반으로 해당 장례식장의 직원 전화번호 목록을 조회합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Array<Object>>} 직원 전화번호 정보를 포함한 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getStaffPhoneNumbersByFuneralId(funeralId) {
    const result = await FuneralStaff.findAll({
      where: { funeralId: funeralId },
      attributes: ['funeralStaffPhoneNumber'],
    });
    return result;
  },

  /**
   * 장례식장 정보 조회
   *
   * 상조팀장 ID를 기반으로 해당 상조팀장의 전화번호를 조회합니다.
   *
   * @param {string} managerId - 상조팀장 ID
   * @returns {Promise<Object>} 상조팀장 전화번호 정보를 포함한 객체
   * @throws {Error} 조회 실패 시 발생
   */
  async getManagerPhoneNumber(managerId) {
    const result = await Manager.findOne({
      where: { managerId: managerId },
      attributes: ['managerPhoneNumber'],
    });
    return result;
  },
};

export default funeralListDao;
