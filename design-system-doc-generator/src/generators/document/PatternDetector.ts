import { ExtractedComponent, DesignPattern, PatternDetectionResult } from '../../types';

export class PatternDetector {
  detectPatterns(components: ExtractedComponent[]): PatternDetectionResult {
    const patterns: DesignPattern[] = [];
    const relatedComponents = new Map<string, string[]>();

    // ボタンパターン
    const buttonComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('button') ||
      c.componentName.toLowerCase().includes('btn')
    );
    if (buttonComponents.length > 1) {
      const buttonPattern: DesignPattern = {
        name: 'ボタンシステム',
        description: 'プロジェクト全体で使用されるボタンコンポーネントのパターン。統一されたスタイルとインタラクションを提供。',
        components: buttonComponents.map(c => c.componentName),
        examples: [this.generatePatternExample('button', buttonComponents)],
      };
      patterns.push(buttonPattern);
      this.updateRelatedComponents(relatedComponents, buttonComponents);
    }

    // フォームパターン
    const formComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('form') ||
      c.componentName.toLowerCase().includes('input') ||
      c.componentName.toLowerCase().includes('field') ||
      c.componentName.toLowerCase().includes('textarea') ||
      c.componentName.toLowerCase().includes('select')
    );
    if (formComponents.length > 2) {
      const formPattern: DesignPattern = {
        name: 'フォームシステム',
        description: 'フォーム要素の一貫したデザインパターン。入力フィールド、バリデーション、レイアウトを統一。',
        components: formComponents.map(c => c.componentName),
        examples: [this.generatePatternExample('form', formComponents)],
      };
      patterns.push(formPattern);
      this.updateRelatedComponents(relatedComponents, formComponents);
    }

    // カードパターン
    const cardComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('card')
    );
    if (cardComponents.length > 0) {
      const cardPattern: DesignPattern = {
        name: 'カードシステム',
        description: 'コンテンツを整理して表示するためのカードコンポーネントパターン。',
        components: cardComponents.map(c => c.componentName),
        examples: [this.generatePatternExample('card', cardComponents)],
      };
      patterns.push(cardPattern);
      this.updateRelatedComponents(relatedComponents, cardComponents);
    }

    // ナビゲーションパターン
    const navComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('nav') ||
      c.componentName.toLowerCase().includes('menu') ||
      c.componentName.toLowerCase().includes('header') ||
      c.componentName.toLowerCase().includes('sidebar')
    );
    if (navComponents.length > 1) {
      const navPattern: DesignPattern = {
        name: 'ナビゲーションシステム',
        description: 'アプリケーション内のナビゲーションを構成するコンポーネントパターン。',
        components: navComponents.map(c => c.componentName),
        examples: [this.generatePatternExample('navigation', navComponents)],
      };
      patterns.push(navPattern);
      this.updateRelatedComponents(relatedComponents, navComponents);
    }

    // レイアウトパターン
    const layoutComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('layout') ||
      c.componentName.toLowerCase().includes('container') ||
      c.componentName.toLowerCase().includes('wrapper') ||
      c.componentName.toLowerCase().includes('grid')
    );
    if (layoutComponents.length > 1) {
      const layoutPattern: DesignPattern = {
        name: 'レイアウトシステム',
        description: 'ページレイアウトを構成するコンポーネントパターン。',
        components: layoutComponents.map(c => c.componentName),
        examples: [this.generatePatternExample('layout', layoutComponents)],
      };
      patterns.push(layoutPattern);
      this.updateRelatedComponents(relatedComponents, layoutComponents);
    }

    return { patterns, relatedComponents };
  }

  private updateRelatedComponents(
    relatedComponents: Map<string, string[]>,
    components: ExtractedComponent[]
  ): void {
    const componentNames = components.map(c => c.componentName);
    components.forEach(component => {
      const related = componentNames.filter(name => name !== component.componentName);
      relatedComponents.set(component.componentName, related);
    });
  }

  private generatePatternExample(
    patternType: string, 
    components: ExtractedComponent[]
  ): string {
    switch (patternType) {
      case 'button':
        return `// ボタンバリエーション
<PrimaryButton onClick={handleClick}>メインアクション</PrimaryButton>
<SecondaryButton onClick={handleClick}>サブアクション</SecondaryButton>
<IconButton icon={<SaveIcon />} onClick={handleSave} />`;

      case 'form':
        return `// フォーム構成例
<Form onSubmit={handleSubmit}>
  <FormField label="名前" name="name" required />
  <FormField label="メール" name="email" type="email" />
  <TextArea label="コメント" name="comment" rows={4} />
  <SubmitButton>送信</SubmitButton>
</Form>`;

      case 'card':
        return `// カード使用例
<Card>
  <CardHeader title="タイトル" />
  <CardBody>
    <p>カードのコンテンツ</p>
  </CardBody>
  <CardFooter>
    <Button>アクション</Button>
  </CardFooter>
</Card>`;

      case 'navigation':
        return `// ナビゲーション構成
<Header>
  <NavMenu items={menuItems} />
  <UserMenu user={currentUser} />
</Header>`;

      case 'layout':
        return `// レイアウト構成
<Layout>
  <Container maxWidth="lg">
    <Grid cols={12}>
      <GridItem span={8}>
        <MainContent />
      </GridItem>
      <GridItem span={4}>
        <Sidebar />
      </GridItem>
    </Grid>
  </Container>
</Layout>`;

      default:
        return '// パターン使用例';
    }
  }
}