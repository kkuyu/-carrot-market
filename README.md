# Carrot Market

Serverless Carrot Market Clone using NextJS, Tailwind, Prisma, PlanetScale and Cloudflare.

## Lecture

[carrot-market](https://nomadcoders.co/carrot-market)

### PlanetScale Database

```
Create DB
pscale database create [name] --region [area]
Connect DB
pscale connect [name]
```

### Prisma Client

```
클라이언트 생성
npx prisma generate
Prisma 관리자 실행
npx prisma studio
```

### Todo

#### DB

- [ ] Record Kind.Favorite -> Record Kind.ProductLike
- [x] Curiosity, Emotion -> Record Kind.StoryLike
- [ ] Review -> ProductReview
- [ ] Comment -> StoryComment
- [ ] Stream -> Streams
- [ ] Message -> StreamsMessages
- [ ] @relation(onDelete: Cascade)

#### Header

- [ ] 공유하기
- [ ] 검색하기
- [ ] 카테고리 메뉴

#### Product

- [ ] 가격제안
- [ ] 무료나눔
- [ ] 리뷰
- [ ] 예약
- [ ] 숨기기

#### Story

- [ ] 댓글 삭제, 수정

#### Profile

- [ ] 매너온도

#### Chats

- [ ] Chats

#### Streams

- [ ] Streams

#### Blogs

- [ ] 판매확률 높이는..
- [ ] 자주묻는..

#### Etc

- [ ] 404, 500
- [ ] 회원 가입 후 최초 진입 시, 프로필 수정 안내 가이드 모달
