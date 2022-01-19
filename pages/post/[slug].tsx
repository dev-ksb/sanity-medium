import { GetStaticProps } from "next";
import React from "react";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";
import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";

interface Props {
  post: Post;
}

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

const Post = ({ post }: Props) => {
  console.log(post);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    fetch("/api/createComment", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.log(error));
  };

  return (
    <main className="max-w-7xl mx-auto">
      <Header />

      <img
        className="w-full h-40 object-cover border-b-2"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />
      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500 mb-2">
          {post.description}
        </h2>

        <div>
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={urlFor(post.author.image).url()!}
            alt=""
          />
          <p className="font-extralight text-sm">
            Blog post by{" "}
            <span className="text-green-600">{post.author.name}</span> -
            Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-10">
          {/* tslint:disable-next-line */}
          <PortableText
            className=""
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="text-2xl font-bold my-5" {...props} />
              ),
              h2: (props: any) => (
                <h2 className="text-xl font-bold my-5" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>

      <hr className="mx-w-lg my-5 mx-auto border border-r-yellow-500" />
      <form
        className="flex flex-col p-5 max-w-2x mx-auto mb-10"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
        <h4 className="text-3xl font-bold">Leave a commen below!</h4>
        <hr className="py-3 mt-2" />

        <input {...register("_id")} type="hidden" name="_id" value={post._id} />

        <label className="block mb-5">
          <span className="text-gray-700">Name</span>
          <input
            className="shadow border rounded py-2 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring px-2"
            type="text"
            placeholder="Kuldeep Singh"
            {...register("name", { required: true })}
          />
        </label>
        <label className="block mb-5">
          <span className="text-gray-700">Email</span>
          <input
            className="shadow border rounded py-2 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring px-2"
            type="email"
            placeholder="name@yourmailid.com"
            {...register("email", { required: true })}
          />
        </label>
        <label className="block mb-5">
          <span className="text-gray-700">Comment</span>
          <textarea
            {...register("comment", { required: true })}
            className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring"
            rows={8}
          />
        </label>

        <div className="flex flex-col p-5">
          {errors.name && (
            <span className="text-red-500">The Name Field is required</span>
          )}
          {errors.email && (
            <span className="text-red-500">The Email Field is required</span>
          )}
          {errors.comment && (
            <span className="text-red-500">The Comment Field is required</span>
          )}
        </div>

        <button
          type="submit"
          className="shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white px-4 py-2 rounded cursor-pointer"
        >
          Submit
        </button>
      </form>

      <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 space-y-2">
        <h3>Comments</h3>
        <hr />
        {post.comments.map((comment) => (
          <div>
            <p className="">
              <span className="text-yellow-500">{comment.name}</span>:{" "}
              {comment.comment}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
};

export const getStaticPaths = async () => {
  const query = `
    *[_type == "post"] {
      _id,
      slug {
		  current
	  },
      }
  `;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `
    *[_type == "post" && slug.current == $slug][0] {
      _id,
	  _createdAt,
      title,
      author -> {
        name,
        image
      },
	  'comments': *[
		  _type == "comment" && 
		  post._ref == ^._id && 
		  approved == true],
      description,
      mainImage,
      slug,
	  body,
      }
  `;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  if (!post) return { notFound: true };

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};

export default Post;
