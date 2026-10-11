import type { Schema, Struct } from '@strapi/strapi';

export interface ContentImage extends Struct.ComponentSchema {
  collectionName: 'components_content_images';
  info: {
    description: 'Imagen grande con pie de foto y marco de navegador opcional';
    displayName: 'Imagen destacada en el cuerpo';
    icon: 'picture';
  };
  attributes: {
    browserFrame: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    caption: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface ContentMarkdown extends Struct.ComponentSchema {
  collectionName: 'components_content_markdowns';
  info: {
    description: 'Pega texto en Markdown: ## t\u00EDtulos, listas, enlaces, tablas y bloques de c\u00F3digo con ```';
    displayName: 'Markdown';
    icon: 'code';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface ContentRichText extends Struct.ComponentSchema {
  collectionName: 'components_content_rich_texts';
  info: {
    description: 'T\u00EDtulos, p\u00E1rrafos, listas, enlaces, citas, c\u00F3digo e im\u00E1genes';
    displayName: 'Texto';
    icon: 'paragraph';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface ContentVideo extends Struct.ComponentSchema {
  collectionName: 'components_content_videos';
  info: {
    description: 'Video subido (MP4/WebM) o enlace de YouTube';
    displayName: 'Video';
    icon: 'play';
  };
  attributes: {
    caption: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    file: Schema.Attribute.Media<'videos'>;
    youtubeUrl: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Metadatos para buscadores y redes sociales';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'content.image': ContentImage;
      'content.markdown': ContentMarkdown;
      'content.rich-text': ContentRichText;
      'content.video': ContentVideo;
      'shared.seo': SharedSeo;
    }
  }
}
