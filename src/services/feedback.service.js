import {Feedback, BannedUser} from '../models/Feedback';
import crypto from 'crypto';
export class FeedbackSystem {
    static instance;
    constructor() {}
    static getInstance() {
        if (!FeedbackSystem.instance) {
            FeedbackSystem.instance = new FeedbackSystem();
        }
        return FeedbackSystem.instance;
    }
    hashUserId(userId) {
        return crypto.createHash('sha256').update(userId).digest('hex');
    }
    async addFeedback(userId, content, anonymous) {
        const hashedUserId = this.hashUserId(userId);
        const isBanned = await BannedUser.findOne({where: {hashedUserId}});
        if (isBanned) {
            throw new Error('차단된 사용자입니다.');
        }
        const feedbackId = crypto.randomBytes(4).toString('hex');
        await Feedback.create({
            id: feedbackId,
            content,
            timestamp: Date.now(),
            hashedUserId,
            originalUserId: anonymous ? '' : userId,
            anonymous,
        });
        return feedbackId;
    }
    async banUser(feedbackId) {
        const feedback = await Feedback.findOne({where: {id: feedbackId}});
        if (!feedback) {
            throw new Error('존재하지 않는 의견입니다.');
        }
        await BannedUser.create({
            hashedUserId: feedback.hashedUserId,
            banTimestamp: Date.now(),
        });
    }
    async unbanUser(feedbackId) {
        const feedback = await Feedback.findOne({where: {id: feedbackId}});
        if (!feedback) {
            throw new Error('존재하지 않는 의견입니다.');
        }
        const bannedUser = await BannedUser.findOne({where: {hashedUserId: feedback.hashedUserId}});
        if (!bannedUser) {
            throw new Error('이 사용자는 차단되지 않았습니다.');
        }
        await BannedUser.destroy({
            where: {
                hashedUserId: feedback.hashedUserId,
            },
        });
    }
    async getAllFeedback() {
        return Feedback.findAll({
            order: [['timestamp', 'DESC']],
        });
    }
}
