import documentManager from '../document-manager';
import { sumDraftCounts } from '../utils/draft';
import { getDeepPopulateDraftCount } from '../utils/populate';

jest.mock('../utils/draft', () => ({
  sumDraftCounts: jest.fn(),
}));

jest.mock('../utils/populate', () => ({
  getDeepPopulateDraftCount: jest.fn(),
}));

const RELATION_LAB_UID = 'api::relation-lab.relation-lab';

describe('document-manager', () => {
  const findMany = jest.fn();
  const count = jest.fn();
  const sumDraftCountsMock = sumDraftCounts as jest.MockedFunction<typeof sumDraftCounts>;
  const getDeepPopulateDraftCountMock = getDeepPopulateDraftCount as jest.MockedFunction<
    typeof getDeepPopulateDraftCount
  >;

  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
    sumDraftCountsMock.mockReset();
    getDeepPopulateDraftCountMock.mockReturnValue({
      populate: { manyToManyBi: true },
      hasRelations: true,
    });

    global.strapi = {
      documents: jest.fn(() => ({
        findMany,
        count,
      })),
    } as any;
  });

  describe('countManyEntriesDraftRelations', () => {
    it('uses the document service so non-localized types are found despite locale=en', async () => {
      const entities = [{ documentId: 'doc-1' }, { documentId: 'doc-2' }];
      findMany.mockResolvedValue(entities);
      sumDraftCountsMock
        .mockResolvedValueOnce({ unpublishedRelations: 0, draftM2mLinks: 1 })
        .mockResolvedValueOnce({ unpublishedRelations: 1, draftM2mLinks: 0 });

      const service = documentManager({ strapi: global.strapi });
      const total = await service.countManyEntriesDraftRelations(
        ['doc-1', 'doc-2'],
        RELATION_LAB_UID,
        'en'
      );

      expect(findMany).toHaveBeenCalledWith({
        populate: { manyToManyBi: true },
        filters: { documentId: { $in: ['doc-1', 'doc-2'] } },
        locale: 'en',
        status: 'draft',
      });
      expect(total).toBe(2);
    });

    it('returns 0 when the content type has no relations to count', async () => {
      getDeepPopulateDraftCountMock.mockReturnValue({ populate: {}, hasRelations: false });

      const service = documentManager({ strapi: global.strapi });
      const total = await service.countManyEntriesDraftRelations(['doc-1'], RELATION_LAB_UID, 'en');

      expect(total).toBe(0);
      expect(findMany).not.toHaveBeenCalled();
    });
  });

  describe('findPage', () => {
    it('passes search query (_q) and filters to count', async () => {
      findMany.mockResolvedValue([{ documentId: 'doc-1' }, { documentId: 'doc-2' }]);
      count.mockResolvedValue(2);

      const service = documentManager({ strapi: global.strapi });
      const result = await service.findPage(
        {
          _q: 'needle',
          filters: { name: { $startsWith: 'needle' } },
          locale: 'en',
          status: 'draft',
          sort: 'createdAt:DESC',
          populate: ['author'],
          page: 1,
          pageSize: 10,
        },
        RELATION_LAB_UID
      );

      expect(count).toHaveBeenCalledWith({
        _q: 'needle',
        filters: { name: { $startsWith: 'needle' } },
        locale: 'en',
        status: 'draft',
      });
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 2,
      });
    });
  });
});
