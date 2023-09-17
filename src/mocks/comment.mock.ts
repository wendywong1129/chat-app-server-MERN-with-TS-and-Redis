import { ICommentDocument, ICommentNameList } from '@comment/interfaces/comment.interface';

export const commentsData: ICommentDocument = {
  _id: '6064861bc25eaa5a5d2f9bf4',
  username: 'Summer',
  avatarColor: '#9c27b0',
  postId: '6027f77087c9d9ccb1555268',
  profilePicture: 'https://res.cloudinary.com/ratingapp/image/upload/6064793b091bf02b6a71067a',
  comment: 'This is a comment',
  createdAt: new Date(),
  userTo: '60263f14648fed5246e322d9'
} as unknown as ICommentDocument;

export const commentNames: ICommentNameList = {
  count: 1,
  names: ['Summer']
};
