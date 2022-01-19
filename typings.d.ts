export interface Post {
	_id: string;
	_createdAt: string;
	title: string;
	author: {
	  name: string;
	  image: string;		
	};
	comments: [{
		name: string;
		comment: string;
	}],
	description: string;
	mainImage: {
		asset: {
			url: string;
		}
	};
	slug: {
		current: string;
	};
	body: [object]
}