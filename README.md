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

- [ ] Stream -> Streams
- [ ] Message -> StreamsMessages
- [ ] @relation(onDelete: Cascade)

#### Header

- [ ] 공유하기
- [ ] 검색하기
- [ ] 카테고리 메뉴

### User

- [ ] 본인인증정보
- [ ] 휴대폰 번호 6개월이내 변경 금지

#### Product

- [ ] 가격제안
- [ ] 무료나눔
- [ ] 예약
- [ ] 숨기기

#### Story

- [ ] 장소추가

#### Profile

- [ ] 매너온도

#### Streams

- [ ] Streams

#### Blogs

- [ ] 판매확률 높이는..
- [ ] 자주묻는..

#### Etc

- [ ] 404, 500
