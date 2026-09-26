import { ForbiddenException } from '@nestjs/common';
import { SelfOnlyGuard } from './self-only.guard';

const ctx = (user: any, params: any): any => ({ switchToHttp: () => ({ getRequest: () => ({ user, params }) }) });

describe('SelfOnlyGuard', () => {
    const guard = new SelfOnlyGuard();
    const A = '11111111-1111-4111-8111-111111111111';
    const B = '22222222-2222-4222-8222-222222222222';

    it('permite el propio uuid (sin distinguir mayúsculas)', () => {
        expect(guard.canActivate(ctx({ userUuid: A }, { uuid: A.toUpperCase() }))).toBe(true);
    });
    it('rechaza el uuid de otro usuario (IDOR)', () => {
        expect(() => guard.canActivate(ctx({ userUuid: A }, { uuid: B }))).toThrow(ForbiddenException);
    });
    it('rechaza si el token no trae userUuid o falta el parámetro', () => {
        expect(() => guard.canActivate(ctx({}, { uuid: A }))).toThrow(ForbiddenException);
        expect(() => guard.canActivate(ctx({ userUuid: A }, {}))).toThrow(ForbiddenException);
        expect(() => guard.canActivate(ctx(undefined, { uuid: A }))).toThrow(ForbiddenException);
    });
});
