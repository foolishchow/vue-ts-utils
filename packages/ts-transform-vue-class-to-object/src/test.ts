import * as ts from "typescript"
import { transformVueClassToObject } from ".";



const source = `
import { VueComponent, Component, CreateElement, PopUpPage, } from "internal";
import { Row, Form, FormItem, Input, Button, Switch, Alert, Upload } from "element-ui";
import { ValidateRules } from "../../../interface/base";
import { FireWeedAdminInterface } from "../../../interface";
import { UploadUtils } from "../../../components";

export type GoodsServiceAddPageProps = {};
/**
 * @title 新增商品服务
 * @show false
 * @parent GoodsServiceListPage
 */
@Component
export class GoodsServiceAddPage extends PopUpPage<{ id: string }>{

    entity: FireWeedAdminInterface.ShopGoodsServiceVo = {
        content: '',
        contentExplain: '',
        sort: 0
    } as any;

    title?: string | JSX.Element | undefined;

    renderContent(h: CreateElement) {
        console.log(this.entity)
        return <Row>
            <Form ref="form" {...{ attrs: { model: this.entity } }} labelWidth="180px">
                <FormItem label="服务内容" prop="content" >
                    <Input type="text" v-model={this.entity.content}></Input>
                </FormItem>
                <FormItem label="服务内容解释" prop="contentExplain" >
                    <Input type="text" v-model={this.entity.contentExplain}></Input>
                </FormItem>
                {/* <FormItem label="排序" prop="sort" >
                    <Input type="text" v-model={this.entity.sort} ></Input>
                </FormItem> */}
            </Form>
        </Row >
    }

    @PopUpPage.Ok()
    async doSave() {
        let res = await FireWeedAdminInterface.ShopGoodsService.Add(this.entity)
        if (res.rescode == 200) {
            this.$message.success("新增成功！");
            this.ExitAndRefreshParent();
        } else {
            this.$message.error(res.msg || "操作失败")
        }
    }


    private mounted() { }

    private created() {
    }

}`;

let result = ts.transform(ts.createSourceFile("", source, ts.ScriptTarget.ESNext, true),
    [transformVueClassToObject],
    { module: ts.ModuleKind.CommonJS });

console.log(result.transformed[0].getText(result.transformed[0]));

setInterval(() => {
    var a = 1;
}, 20000)



function makeFactorialFunction() {
    const functionName = ts.createIdentifier("factorial");
    const paramName = ts.createIdentifier("n");
    const parameter = ts.createParameter(
    /*decorators*/ undefined,
    /*modifiers*/ undefined,
    /*dotDotDotToken*/ undefined,
        paramName
    );

    const condition = ts.createBinary(paramName, ts.SyntaxKind.LessThanEqualsToken, ts.createLiteral(1));
    const ifBody = ts.createBlock([ts.createReturn(ts.createLiteral(1))], /*multiline*/ true);

    const decrementedArg = ts.createBinary(paramName, ts.SyntaxKind.MinusToken, ts.createLiteral(1));
    const recurse = ts.createBinary(paramName, ts.SyntaxKind.AsteriskToken, ts.createCall(functionName, /*typeArgs*/ undefined, [decrementedArg]));
    const statements = [ts.createIf(condition, ifBody), ts.createReturn(recurse)];

    // return ts.createFunctionDeclaration(
    // /*decorators*/ undefined,
    // /*modifiers*/[ts.createToken(ts.SyntaxKind.ExportKeyword)],
    // /*asteriskToken*/ undefined,
    //     functionName,
    // /*typeParameters*/ undefined,
    //     [parameter],
    // /*returnType*/ ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    //     ts.createBlock(statements, /*multiline*/ true)
    // );


    let node = ts.createVariableDeclaration(
        "adasd",
        undefined,
        ts.createObjectLiteral()
    );

    return ts.createVariableDeclarationList([node], ts.NodeFlags.Const)
}

// const resultFile = ts.createSourceFile("someFileName.ts", "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
// const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

// const result1 = printer.printNode(ts.EmitHint.Unspecified, makeFactorialFunction(), resultFile);
// console.log(result1);